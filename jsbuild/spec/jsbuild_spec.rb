require File.join(File.dirname(__FILE__), 'spec_helper')
libs %w{jsbuild}

describe JS::Build do

  def file_contents(file)
    File.open(file) {|f| f.readlines.join('\n')}
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

  it "passes simple files through unaffected" do
    JS::Build.build(*io_pair('simple.js'))
    compare_files(*io_pair('simple.js'))
  end

  it "removes single-line modules" do
    JS::Build.build(*io_pair('oneline.js'))
    expected_contents('oneline-built.js')
  end
end