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

  it "passes simple files through unaffected" do
    JS::Build.build(file('spec/input/simple.js'), file('spec/output/simple-built.js'))
    compare_files(file('spec/input/simple.js'), file('spec/output/simple-built.js'))
  end

  it "removes single-line modules" do
    JS::Build.build(file('spec/input/oneline.js'), file('spec/output/oneline-built.js'))
    expected_contents('oneline-built.js')
  end
end