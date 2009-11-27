require File.join(File.dirname(__FILE__), 'spec_helper')
libs %w{jsbuild}

describe JS::Build do

  def file_contents(file)
    File.open(file) {|f| f.readlines.join}
  end

  def compare_files(input, output)
    file_contents(output).should == file_contents(input)
  end

  def expected_contents(filename)
    compare_files(file('spec/expected/' + filename), file('spec/output/' + filename))
  end

  def io_pair(filename)
    [file('spec/input/' + filename), file('spec/output/' + filename.sub('.js', '-built.js'))]
  end

  before(:all) do
    FileUtils.rm Dir.glob file('spec/output/*.js');
  end

  it "passes simple files through unaffected" do
    JS::Build.build(*io_pair('simple.js'))
    compare_files(*io_pair('simple.js'))
  end

  it "removes multi-line modules" do
    JS::Build.build(*io_pair('multiline.js'))
    expected_contents('multiline-built.js')
  end

  it "leaves remaining code alone" do
    JS::Build.build(*io_pair('codeafter.js'))
    expected_contents('codeafter-built.js')
  end
  
  it "inlines requirements" do pending do
    JS::Build.build(*io_pair('require-simple.js'))
    expected_contents('require-simple-built.js')
  end end
end

describe JS::Module do
  before do
    @output = StringIO.new("", 'w')
  end

  it "can be constructed without parsing" do
    JS::Module.new.should_not be_nil
  end

  it "has a path" do
    JS::Module.new('input').path.should == 'input'
  end

  it "parses until end of block" do
    @input = StringIO.new("});", 'r')
    JS::Module.new.parse(@input, @output)
    @input.should be_eof
    @output.string.should == ""
  end

  it "detects malformed block" do
    @input = StringIO.new(")}", 'r')
    lambda {JS::Module.new.parse(@input, @output)}.should raise_error
  end

  it "copies streams" do
    JS::Module.new.copy_stream(StringIO.new("var blarg = 'bleep';"), @output)
    @output.string.should match(/var blarg = 'bleep';/)
  end

  it "copies files" do
    JS::Module.new.copy_file(file('spec/input/simple.js'), @output)
    @output.string.should match(/var blarg = 'bleep';/)
  end

  it "consumes stuff inside block" do
    @input = StringIO.new(<<INPUT.rstrip, 'r')
  var x = 1;
});
INPUT
    JS::Module.new.parse(@input, @output)
    @input.should be_eof
    @output.string.should == ""
  end

  it "leaves remaining code alone" do
    @input = StringIO.new(<<INPUT, 'r')
});

var x = 1;
INPUT
    JS::Module.new.parse(@input, @output)
    @input.read.should match("var x = 1;")
    @output.string.should == ""
  end

  it "inlines requirements" do pending do
    @input = StringIO.new(<<INPUT, 'r')
  m.require('simple.js')
});
INPUT
    JS::Module.new.parse(@input, @output)
    @output.string.should match("var blarg = 'bleep';")
  end end
end